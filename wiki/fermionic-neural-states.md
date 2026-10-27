# Lattice fermionic states

> **In brief.** A fermionic wavefunction in the occupation-number basis is antisymmetric under particle exchange, and no positive network or local sign rule reproduces that structure at finite doping. Every competitive neural ansatz for lattice fermions therefore keeps a determinant or a Pfaffian and uses the network to make its orbitals depend on the whole configuration: backflow transformations, hidden fermions that enlarge the determinant, configuration-dependent pairing matrices, or tensor-shaped corrections, with a Jastrow factor on top. The choice of mean-field object (Slater determinant, its particle-hole transform, or a Pfaffian) decides which phases the ansatz represents at the mean-field level and biases what it converges to; the backbone (multilayer perceptron, group-convolutional network, transformer) decides the accuracy. These states hold every entry on the Hubbard instances of Ketboard.

Notation follows the [conventions page](../notation/).

## The antisymmetry problem

Work in the Fock basis $\lvert\mathbf n\rangle$ of occupations $n_{i\sigma}\in\{0,1\}$ with a fixed ordering of the modes. The Hamiltonian matrix elements in this basis carry Jordan–Wigner signs from the ordering, and the ground-state amplitudes $\Psi(\mathbf n)$ have a sign structure that is not a function of a few local quantities, except in special cases (one dimension, half filling on a bipartite lattice). A real positive network cannot represent it; a network with a phase output must learn it from the local energy alone, which fails at the accuracies required here. The Slater determinant solves the problem by construction: with single-particle orbitals $\phi_k(r)$ and the occupied positions $r_1,\dots,r_{N_e}$ of a configuration,

$$
\Psi_{\mathrm{SD}}(\mathbf n)=\det\bigl[\phi_k(r_i)\bigr]_{k,i=1}^{N_e}
$$

is antisymmetric, cheap ($O(N_e^3)$, or $O(N_e^2)$ per local update with a cached inverse), and exact for noninteracting fermions. A Jastrow factor $e^{J(\mathbf n)}$ multiplies in density correlations but cannot change the nodes, i.e. the sign structure, of the determinant. Everything below is a way of letting the network change the nodes.

## Neural backflow

Feynman's backflow lets each orbital depend on the positions of the other particles. Luo and Clark replace the hand-built displacement by a feed-forward network (arXiv:1807.10770):

$$
\phi^{b}_{k\sigma}(r_i;\mathbf n)=\phi_{k\sigma}(r_i)+a^{\mathrm{NN}}_{ki,\sigma}(\mathbf n),
$$

one network per spin species, whose outputs are the $N_e\times N$ corrections to the orbital matrix, so that $\Psi(\mathbf n)=\det[\phi^b_{k\sigma}(r_i;\mathbf n)]$ (times a Jastrow factor, with a BCS pairing function in place of the orbitals as a variant). The standard lattice backflow, in which the correction is a sum over neighbours weighted by their double occupancy and holon content, is a one-layer special case. The construction dresses an arbitrary mean-field state, is systematically improvable in the width of the network, and directly alters the sign structure: on the $4\times4$ Hubbard cluster at $U/t=8$, $n=7/8$, where the exact energy is known, it reduces the relative error of the Slater–Jastrow and pairing states it dresses substantially, and restores the symmetry of observables that the mean-field state breaks. Its cost is the obstacle: every orbital entry changes with every configuration, so a local move needs a fresh $O(N_e^3)$ determinant unless the correction has low-rank structure.

## Hidden-fermion determinant states

Moreno, Carleo, Georges and Stokes enlarge the Fock space by $\tilde M$ hidden modes with $\tilde N$ hidden fermions and write a Slater determinant of $N_e+\tilde N$ particles in the augmented space (arXiv:2111.10420). A constraint $\tilde{\mathbf n}=F(\mathbf n)$, which fixes the hidden occupations as a function of the visible ones, projects back to the physical space, giving

$$
\Psi(\mathbf n)=\det\begin{pmatrix}\phi_v(\mathbf n)&\chi_v(\mathbf n)\\ \phi_h(\mathbf n)&\chi_h(\mathbf n)\end{pmatrix},
$$

in which the upper block is the ordinary $N_e\times(N_e+\tilde N)$ matrix of visible orbitals evaluated at the occupied visible modes, and the lower $\tilde N\times(N_e+\tilde N)$ block, the orbitals evaluated at the hidden modes, is produced by a neural network from the visible configuration. The family contains the Slater determinant ($\tilde N=0$), is proven universal, and its cost is that of a determinant of size $N_e+\tilde N$ with the hidden block as the only configuration-dependent part, which allows low-rank updates when $\tilde N\ll N_e$. On the $4\times L$ Hubbard tori at $U=8$, $n=7/8$ the state with a fully parametrized hidden block gave $-0.7409(1)$, $-0.7633(7)$ and $-0.753(2)$ for $L=4,8,16$ (Table IV); on the $8\times8$ torus a transformer-backbone version gives $-0.7454(9)$ (Sharma et al., arXiv:2510.11710), see the [Hubbard page](../hubbard-square-lattice/).

## Pfaffians and pairing

A Pfaffian of an antisymmetric pairing matrix generalizes the determinant and represents paired (BCS-like) states and unpaired states on the same footing. Chen, Wan, Sengupta, Georges and Roth define the hidden-fermion Pfaffian state (arXiv:2507.10705)

$$
\Psi(\mathbf n)=J(\mathbf n)\,\mathrm{Pf}\Bigl[\,\mathbf n\star\bigl(F+H(\mathbf n)\,A\,H^{T}(\mathbf n)\bigr)\star\mathbf n\Bigr],
$$

with $F$ a mean-field pairing matrix, $A$ an antisymmetric $2\tilde n\times2\tilde n$ coupling between $\tilde n$ hidden fermions, $H(\mathbf n)$ the configuration-dependent hidden orbitals, $\star$ the slicing to the occupied modes, and $J$ a neural Jastrow factor; $J$ and $H$ are both read off one group-convolutional network. Because the correction $HAH^T$ has rank $2\tilde n$, the ratio between amplitudes of configurations that differ by a few hops is a low-rank update, which is what makes several hundred electrons affordable. The block-circulant structure of $F$ fixes the symmetry-breaking unit cell (filled or half-filled stripe), and the full symmetry is restored by projection afterwards (Roth, Chen, Sengupta, Georges, arXiv:2511.07566). On $16\times4$ at $U=8$, $n=7/8$ the state gives $-0.76413(3)$, the lowest energy on that torus.

The symmetry-preserving backflow pairing state of Rende, Viteritti and Georges keeps a pair-product form with a configuration-dependent pairing matrix (arXiv:2608.12465),

$$
\Psi_\theta(\mathbf n)=\Bigl\langle\mathbf n\Bigm\vert\Bigl(\sum_{ij}f_{ij}(\mathbf n)\,c^\dagger_{i\uparrow}c^\dagger_{j\downarrow}\Bigr)^{N_e/2}\Bigm\vert0\Bigr\rangle
=\det\bigl[\mathbf n_\uparrow\star f(\mathbf n)\star\mathbf n_\downarrow\bigr],
\qquad
f_{ij}(\mathbf n)=\frac{e^{-\lambda d(i,j)}}{\sum_{i'j'}e^{-\lambda d(i',j')}}\sum_{\alpha=1}^{d}W_{i-j,\alpha}\,y^{\uparrow}_{i\alpha}(\mathbf n)\,y^{\downarrow}_{j\alpha}(\mathbf n),
$$

where the vectors $\mathbf y^\sigma_i(\mathbf n)$ come from a translationally equivariant transformer and $W$ depends only on the displacement $i-j$, so the state is translation-invariant by construction and has no stripe built in; since only opposite spins pair, the Pfaffian reduces to a determinant. The same paper shows that the unconstrained version (orbitals $\Phi^\sigma_{i\alpha}$ read off site by site, with $f_{ij}=\sum_\alpha\Phi^\uparrow_{i\alpha}\Phi^\downarrow_{j\alpha}$) gets trapped in distinct local minima that break the symmetry. The symmetry-preserving state gives the lowest energies on the [t–t′ instances](../t-tprime-hubbard/) from $12\times12$ to $24\times24$.

## Tensor backflow

Zhou, Zhou and Liang parametrize the backflow correction directly as a tensor over sites and orbitals, without a neural network, with backflow terms from nearest or next-nearest neighbours and corrections on fictitious particles of the opposite spin, and improve the result with one Lanczos step (arXiv:2308.11823). Started from an unrestricted Hartree–Fock state, it reaches energies competitive with neural backflow on $16\times4$ and $16\times16$ tori and stabilizes the linear stripe at $t'=0$ (Liang, arXiv:2507.01856); with symmetry projection and a Lanczos step on $8\times8$ at $t'=-0.2$ it reaches $-0.7441(8)$ (arXiv:2609.22618). It has the same determinant-plus-correction structure with a simpler correction, and its energies are within a few $10^{-3}t$ of the best networks.

## Backbones, symmetrization and multi-determinant tricks

- **Backbones.** Multilayer perceptrons (Luo and Clark; Loehr and Clark, arXiv:2510.26906), group-convolutional networks (arXiv:2507.10705), transformers (Gu et al., arXiv:2507.02644; Sharma et al., arXiv:2510.11710; Viteritti et al., arXiv:2604.21978; arXiv:2608.12465) and sparse or deep convolutional stacks (Gu et al., arXiv:2604.25775) have all been used. Sharma et al. find hidden-fermion and Jastrow–backflow determinants with the same transformer backbone to be of similar accuracy on the $8\times8$ torus, and output averaging over the symmetry group to be the best symmetrization, at a cost that grows with system size.
- **Low-rank updates.** The sparse convolutional design of SCALE restricts which orbital entries a local move can change, reducing a sweep from $O(N^4)$ to $O(N^3)$ with a measured speed-up above $40\times$ (arXiv:2604.25775); the hidden-fermion constructions get the same effect from the rank of the correction.
- **Multi-determinant expansions.** Loehr and Clark find that the gain from widening a backflow network saturates, while a Lanczos step, a diffusion Monte Carlo projection and a symmetry projection give similar improvements at small cost, and that optimizing the projected, symmetrized state directly gains more: $-0.76258(1)$ for a single determinant and $-0.76340(2)$ for four determinants from four optimized symmetries on $16\times4$ (arXiv:2510.26906). Huang, Ou and Ozolins reach the same regime with a multi-determinant expansion built from low-rank shifts (arXiv:2609.26544).
- **Variational bias.** Viteritti et al. show on the $8\times8$ t–t′ torus that a determinant, a particle-hole determinant and a Pfaffian with the same transformer backbone converge to energies within $10^{-3}t$ and to different orders, the determinant favouring stripes and the particle-hole determinant pairing, until symmetry restoration and variance reduction bring them to the same coexisting state (arXiv:2604.21978). The practical rule is to report correlation functions as a function of the variance, not at a single accuracy.

## Relatives

The RBM multiplied by a pair-product state of Nomura et al. (arXiv:1709.06475) is the spin-model version of the same idea, with the Pfaffian supplying a fermionic sign prior and the network the correlations; see the [RBM page](../restricted-boltzmann-machine/). Neuralized fermionic tensor networks replace the determinant by a fermionic tensor network whose tensors a network modulates (Du, Chen, Chan, arXiv:2506.08329). In continuous space, [FermiNet and PauliNet](../neural-orbitals/) use permutation-equivariant networks acting on electron coordinates, while [message-passing backflow and pairing](../message-passing-backflow/) extends coordinate and Pfaffian constructions to continuous particles. The [continuous-space introduction](../continuous-space/) explains the Hamiltonian, cusps and Laplacian estimator; the [electron-gas page](../homogeneous-electron-gas/) defines the periodic benchmarks.

## References

- D. Luo, B. K. Clark, *Backflow transformations via neural networks for quantum many-body wave functions*, arXiv:1807.10770 (2018). Neural backflow.
- J. R. Moreno, G. Carleo, A. Georges, J. Stokes, *Fermionic wave functions from neural-network constrained hidden states*, arXiv:2111.10420 (2021). Hidden-fermion determinant states; universality.
- Y.-T. Zhou, Z.-W. Zhou, X. Liang, *Solving Fermi-Hubbard-type models by tensor representations of backflow corrections*, arXiv:2308.11823 (2023). Tensor backflow.
- X. Liang, *Investigating the Fermi-Hubbard model by the tensor-backflow method*, arXiv:2507.01856 (2025); *Probing d-wave pairing in the t–t′–U Hubbard model with tensor-backflow wave functions*, arXiv:2609.22618 (2026).
- A. Chen, Z.-Q. Wan, A. Sengupta, A. Georges, C. Roth, *Neural network-augmented Pfaffian wave-functions for scalable simulations of interacting fermions*, arXiv:2507.10705 (2025). Hidden-fermion Pfaffian states.
- C. Roth, A. Chen, A. Sengupta, A. Georges, *Superconductivity in the two-dimensional Hubbard model revealed by neural quantum states*, arXiv:2511.07566 (2025).
- Y. Gu et al., *Solving the Hubbard model with neural quantum states*, arXiv:2507.02644 (2025). Transformer neural backflow.
- L. Sharma, A. Shokry, R. Nutakki, O. Simard, M. Ferrero, F. Vicentini, *Comparing symmetrized determinant neural quantum states for the Hubbard model*, arXiv:2510.11710 (2025).
- K. Loehr, B. K. Clark, *Enhancing neural network backflow*, arXiv:2510.26906 (2025). Saturation with width; multi-determinant expansions.
- L. L. Viteritti, R. Rende, C. Roth, A. Sengupta, G. Carleo, A. Georges, *Beyond variational bias: resolving intertwined orders in the Hubbard model*, arXiv:2604.21978 (2026).
- Y. Gu et al., *Pareto frontier of neural quantum states: scalable, affordable, and accurate convolutional backflow for strongly correlated lattice fermions*, arXiv:2604.25775 (2026). SCALE and ACE.
- R. Rende, L. L. Viteritti, A. Georges, *Superconductivity in the t–t′ Hubbard model from symmetry-preserving neural-network quantum states*, arXiv:2608.12465 (2026). Symmetry-preserving backflow pairing.
- T. Huang, X. Ou, V. Ozolins, *Neural network backflow with low-rank multi-determinant updates*, arXiv:2609.26544 (2026).
- Y. Nomura, A. S. Darmawan, Y. Yamaji, M. Imada, *Restricted Boltzmann machine learning for solving strongly correlated quantum systems*, arXiv:1709.06475 (2017). RBM times pair-product states.
- S.-J. Du, A. Chen, G. K.-L. Chan, *Neuralized fermionic tensor networks for quantum many-body systems*, arXiv:2506.08329 (2025).
- D. Pfau, J. S. Spencer, A. G. D. G. Matthews, W. M. C. Foulkes, *Ab initio solution of the many-electron Schrödinger equation with deep neural networks*, arXiv:1909.02487 (2019).
- J. Hermann, Z. Schätzle, F. Noé, *Deep neural network solution of the electronic Schrödinger equation*, arXiv:1909.08423 (2019).
