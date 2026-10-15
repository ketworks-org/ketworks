# Convolutional and group-convolutional networks

> **In brief.** A convolutional network applies the same local filter at every lattice site, so translation symmetry is built into the weights rather than imposed afterwards; a final sum over sites makes the amplitude invariant. Group convolutions extend the weight sharing from translations to the full space group, with feature maps indexed by group elements, and give invariant or symmetry-projected amplitudes without averaging over the group at the output. Residual stacks of such layers trained with kernel-formulation stochastic reconfiguration hold the lowest energies on the $10\times10$ and $16\times16$ J₁–J₂ tori, and convolutional stacks are the backbone of the most accurate and the cheapest fermionic backflow states.

Notation follows the [conventions page](../notation/).

## Convolutional networks

A convolutional layer on a lattice with periodic boundaries maps a stack of $C_{\mathrm{in}}$ feature maps $f^{(c)}_{\mathbf x}$ to $C_{\mathrm{out}}$ maps

$$
f'^{(c')}_{\mathbf x}=\Gamma\Bigl(\sum_{c}\sum_{\boldsymbol\delta\in K}W^{(c'c)}_{\boldsymbol\delta}\,f^{(c)}_{\mathbf x+\boldsymbol\delta}+b^{(c')}\Bigr),
$$

with a kernel $K$ of fixed shape, weights that do not depend on $\mathbf x$, and a pointwise nonlinearity $\Gamma$. Each layer is equivariant under translations, $f'(T\boldsymbol\sigma)=Tf'(\boldsymbol\sigma)$, and a final sum (or product) over $\mathbf x$ of the last feature map gives a translation-invariant $\log\Psi_\theta$. The [symmetric RBM](../restricted-boltzmann-machine/) is the special case of one layer with full-lattice filters, $\log2\cosh$ activation and a sum readout; a deep CNN replaces it with several layers of small filters, so that the receptive field grows with depth while the parameter count stays $O(\sum_l C_lC_{l+1}\lvert K\rvert)$, independent of $N$.

The first NQS CNN for a frustrated model was the complex-valued network of Choo, Neupert and Carleo for the square-lattice J₁–J₂ model: six convolutional layers with 12, 10, 8, 6, 4 and 2 channels, complex weights, a complex generalization of the ReLU, and a Marshall sign prior multiplied in by hand (arXiv:1903.06713). Liang et al. applied real CNNs with a separate sign treatment to the same model (arXiv:1807.09422). Two early lessons carried over to everything after: the network can learn amplitudes well and signs poorly, and a sign prior that is wrong on a fraction of configurations caps the accuracy, see the [J₁–J₂ page](../j1j2-square-lattice/).

## Group convolutions

A space group $G$ (translations with rotations and reflections, $p4m$ on the square lattice and $p6m$ on the triangular lattice) is non-abelian, and an ordinary convolution is equivariant only under its translation subgroup. Roth and MacDonald (arXiv:2104.05085) define feature maps on the group itself, $f_g$ for $g\in G$, and the group convolution

$$
f^{1}_g=\Gamma\Bigl(\sum_{\mathbf x}W^{0}_{g^{-1}\mathbf x}\,\sigma_{\mathbf x}\Bigr),\qquad
f^{i+1}_g=\Gamma\Bigl(\sum_{h\in G}W^{i}_{g^{-1}h}\,f^{i}_h\Bigr),
$$

which satisfies $\sum_hW_{g^{-1}h}f_{uh}=\sum_hW_{g^{-1}u^{-1}h}f_h=C_{ug}$: acting with $u\in G$ on the input permutes the output feature map by $u$. The first layer embeds the lattice into the group, the later layers convolve on the group. After $L$ layers the amplitude with character $\chi$ is

$$
\Psi_\theta(\boldsymbol\sigma)=\sum_{g\in G}\chi_g^{-1}\exp\bigl(f^{L}_g\bigr),
$$

a projection onto the chosen irreducible representation that costs nothing beyond the forward pass, because the group index is already part of the feature map. The cost of a layer is $O(\lvert G\rvert\cdot\lvert K\rvert\cdot C^2)$ per site, with $\lvert G\rvert/N$ equal to the point-group order (8 or 12). A plain CNN whose output is averaged over the point group is the special case in which the filters connecting different point-group poses are set to zero (arXiv:2104.05085, Sec. VIII B), and the full GCNN was found to be the more accurate of the two at equal parameter count. Choices that mattered in practice: SELU activations applied separately to real and imaginary parts, filters restricted to third neighbours on the triangular lattice, and a single learning rate across ordered and spin-liquid regimes.

## Residual and deep networks

Stacking many group-convolutional layers runs into the usual optimization problems of depth. Roth, Szabó and MacDonald (arXiv:2211.07749) use residual blocks, $f^{i+1}=f^i+\mathrm{block}(f^i)$, with the blocks initialized so that every hidden layer starts as the identity, and a layer-wise variant of stochastic reconfiguration (LayerSR) to train them; the networks that produced the $10\times10$ J₁–J₂ energy $-0.497437(7)$ and the triangular $6\times6$ energy $-0.560313(3)$ have four to eight layers of six feature maps, and twelve residual blocks for the larger triangular clusters. Chen and Heyl (arXiv:2302.01941) train residual CNNs with up to 64 convolutional layers (ResNet1) and more than $10^6$ parameters (ResNet2) with MinSR, the kernel formulation of SR described on the [optimization page](../optimization/), and obtain $e=-0.4976921(4)$ on $10\times10$ and $-0.4967163(8)$ on $16\times16$ at $J_2/J_1=0.5$, both the lowest variational energies on those tori at the time, with translation symmetry in the weights and the point group by projection. Depth gives the expressivity, and an optimizer whose cost is linear in the parameter count makes the depth usable.

Networks of this family have also been scaled by brute force. Li et al. train a CNN with $106\,529$ parameters on the Sunway supercomputer with transfer learning between lattice sizes and obtain $-0.49717$ on $10\times10$ (arXiv:2108.13830); Liang et al. push the same approach to a $36\times36$ torus (arXiv:2204.07816). Lattice convolutional networks define the filters on the bonds and plaquettes of a general lattice so that the same architecture serves square, triangular and kagome lattices (Fu et al., arXiv:2206.07370). Reh, Schmitt and Gärttner (arXiv:2301.06788) and Wang, He and Lu (arXiv:2308.09664) study design choices, the latter optimizing the amplitude network with the phase fixed by a sign rule.

## Fermions

Convolutional stacks are the backbone of several fermionic states. The hidden-fermion Pfaffian state of Chen et al. computes both its Jastrow factor and its hidden-fermion orbitals from one group-convolutional network (arXiv:2507.10705; Roth et al., arXiv:2511.07566). Gu et al. build two convolutional backflow states for the Hubbard model: SCALE, whose sparse convolutional design allows low-rank determinant updates and reduces the cost per sweep from $O(N^4)$ to $O(N^3)$, and ACE, a deep convolutional stack tuned for accuracy; the pair defines the current efficiency–accuracy frontier on tori up to $32\times32$ (arXiv:2604.25775). See the [fermionic states page](../fermionic-neural-states/).

## Results on Ketboard instances

Energies per site of convolutional networks on the $10\times10$ J₁–J₂ torus at $J_2/J_1=0.5$, in chronological order (sources and printed tokens are in Ketboard):

| Network | $e$ | Source |
| --- | --- | --- |
| Complex CNN with Marshall prior | $-0.49516(1)$ | Choo, Neupert, Carleo, arXiv:1903.06713 |
| Separate amplitude and phase CNNs | $-0.494757(12)$ | Szabó and Castelnovo, arXiv:2002.04613 |
| PEPS multiplied by a deep CNN | $-0.495502$ | Liang, Dong, He, arXiv:2009.14370 |
| CNN, $106\,529$ parameters, transfer learning | $-0.49717$ | Li et al., arXiv:2108.13830 |
| Deep CNN, $L=10$ | $-0.497468$ | Liang et al., arXiv:2204.07816 |
| Group-convolutional network | $-0.497437(7)$ | Roth, Szabó, MacDonald, arXiv:2211.07749 |
| CNN with revised design choices | $-0.49586(4)$ | Reh, Schmitt, Gärttner, arXiv:2301.06788 |
| Residual CNN with MinSR | $-0.4976921(4)$ | Chen and Heyl, arXiv:2302.01941 |
| Amplitude-optimized CNN with $C_{4v}$ | $-0.495627(6)$ | Wang, He, Lu, arXiv:2308.09664 |

On the triangular $6\times6$ torus the group-convolutional networks give $-0.55922$ (arXiv:2104.05085) and $-0.560313(3)$ (arXiv:2211.07749) against the exact $-0.5603734$, and the lattice convolutional network $-0.5601(4)$ (arXiv:2206.07370); see the [triangular page](../triangular-heisenberg/).

Within the family the energy follows the optimizer and the symmetry treatment more than the filter design: the three lowest entries use group symmetry, in the weights or by projection, and stochastic reconfiguration or MinSR. The gap between the best CNN and the best [transformer](../transformer-wavefunctions/) on $10\times10$ is below $10^{-4}$, which the instance cannot resolve. On larger tori the transformer with spatial attention is ahead (arXiv:2602.02665).

## References

- K. Choo, T. Neupert, G. Carleo, *Study of the two-dimensional frustrated J₁–J₂ model with neural network quantum states*, arXiv:1903.06713 (2019). Complex CNN with sign prior.
- X. Liang, W.-Y. Liu, P.-Z. Lin, G.-C. Guo, Y.-S. Zhang, L. He, *Solving frustrated quantum many-particle models with convolutional neural networks*, arXiv:1807.09422 (2018).
- C. Roth, A. H. MacDonald, *Group convolutional neural networks improve quantum state accuracy*, arXiv:2104.05085 (2021). Group convolutions on $p4m$ and $p6m$.
- C. Roth, A. Szabó, A. H. MacDonald, *High-accuracy variational Monte Carlo for frustrated magnets with deep neural networks*, arXiv:2211.07749 (2022). Residual GCNNs and LayerSR.
- A. Chen, M. Heyl, *Empowering deep neural quantum states through efficient optimization*, arXiv:2302.01941 (2023). Deep residual CNNs with MinSR.
- M. Li et al., *Bridging the gap between deep learning and frustrated quantum spin system for extreme-scale simulations on new generation of Sunway supercomputer*, arXiv:2108.13830 (2021).
- X. Liang et al., *2¹²⁹⁶ exponentially complex quantum many-body simulation via scalable deep learning method*, arXiv:2204.07816 (2022).
- C. Fu, X. Zhang, H. Zhang, H. Ling, S. Xu, S. Ji, *Lattice convolutional networks for learning ground states of quantum many-body systems*, arXiv:2206.07370 (2022).
- M. Reh, M. Schmitt, M. Gärttner, *Optimizing design choices for neural quantum states*, arXiv:2301.06788 (2023).
- J.-Q. Wang, R.-Q. He, Z.-Y. Lu, *Variational optimization of the amplitude of neural-network quantum many-body ground states*, arXiv:2308.09664 (2023).
- X. Liang, S.-J. Dong, L. He, *Hybrid convolutional neural network and PEPS wave functions for quantum many-particle states*, arXiv:2009.14370 (2020).
- A. Szabó, C. Castelnovo, *Neural network wave functions and the sign problem*, arXiv:2002.04613 (2020).
- A. Chen, Z.-Q. Wan, A. Sengupta, A. Georges, C. Roth, *Neural network-augmented Pfaffian wave-functions for scalable simulations of interacting fermions*, arXiv:2507.10705 (2025). GCNN backbone for fermions.
- Y. Gu et al., *Pareto frontier of neural quantum states: scalable, affordable, and accurate convolutional backflow for strongly correlated lattice fermions*, arXiv:2604.25775 (2026). SCALE and ACE.
- L. L. Viteritti, R. Rende, S. Sachdev, G. Carleo, *Approaching the thermodynamic limit with neural-network quantum states*, arXiv:2602.02665 (2026). Comparison with residual CNNs on $20\times20$.
