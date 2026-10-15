# Restricted Boltzmann machine

> **In brief.** The RBM is a two-layer network whose hidden layer can be summed analytically, giving the closed form $\log\Psi=\sum_ia_i\sigma_i+\sum_j\log2\cosh(b_j+\sum_iW_{ij}\sigma_i)$. Its accuracy is controlled by one integer, the hidden-unit density $\alpha=M/N$. Weight sharing over lattice translations makes it a one-layer convolutional network; complex parameters give it a phase. It is the ansatz of the founding paper and still the baseline against which new architectures are measured.

Notation follows the [conventions page](../notation/).

The restricted Boltzmann machine (RBM) is the ansatz with which Carleo and Troyer introduced neural quantum states (arXiv:1606.02318). Two layers, one analytic marginalization, a closed-form log-amplitude, and a parameter count that interpolates between a Jastrow factor and an arbitrarily expressive variational state through $\alpha$.

## Definition

For $N$ spins $\sigma_i=\pm1$ in the $S^z$ basis and $M$ hidden binary units $h_j=\pm1$, the RBM wavefunction is the marginal of a Boltzmann weight with no intra-layer couplings:

$$
\Psi(\boldsymbol{\sigma})=\sum_{\{h_j\}}\exp\!\Bigl(\sum_i a_i\sigma_i+\sum_j b_jh_j+\sum_{ij}W_{ij}\sigma_ih_j\Bigr).
$$

Because the hidden units do not interact with one another, the sum over $2^M$ hidden configurations factorizes:

$$
\Psi(\boldsymbol{\sigma})=e^{\sum_i a_i\sigma_i}\prod_{j=1}^{M}2\cosh\!\Bigl(b_j+\sum_i W_{ij}\sigma_i\Bigr).
$$

The parameters $\theta=(a,b,W)$ are complex in general: the wavefunction is holomorphic in them, and the phase of $\Psi$ is produced by the imaginary parts. With $\alpha=M/N$ the ansatz has $N+M+NM=N(1+\alpha+\alpha N)$ parameters; for $\alpha$ of order one this is quadratic in system size, like a two-body Jastrow factor, but the functional form is far richer.

## Log-amplitude form

With the hidden-layer pre-activations $\vartheta_j(\boldsymbol{\sigma})=b_j+\sum_iW_{ij}\sigma_i$,

$$
\log\Psi(\boldsymbol{\sigma})=\sum_i a_i\sigma_i+\sum_{j=1}^{M}\log\bigl[2\cosh\vartheta_j(\boldsymbol{\sigma})\bigr],
$$

a single-hidden-layer network with input $\boldsymbol{\sigma}$, activation $\log2\cosh$, and a sum (not a learned readout) over the hidden layer. Everything VMC needs follows from this expression.

- **Ratios for the local energy and Metropolis.** For a configuration $\boldsymbol{\sigma}'$ differing from $\boldsymbol{\sigma}$ on a set of flipped sites $f$, $\vartheta_j(\boldsymbol{\sigma}')=\vartheta_j(\boldsymbol{\sigma})-2\sum_{i\in f}W_{ij}\sigma_i$. Caching the vector $\vartheta(\boldsymbol{\sigma})$ makes each ratio $\Psi(\boldsymbol{\sigma}')/\Psi(\boldsymbol{\sigma})$ cost $O(M|f|)$ instead of $O(NM)$, so the full Heisenberg local energy on a lattice with $O(N)$ bonds costs $O(NM)$, the same as one forward pass.
- **Log-derivatives.** The quantities entering the gradient and the SR matrix are elementary:

$$
O_{a_i}=\sigma_i,\qquad
O_{b_j}=\tanh\vartheta_j,\qquad
O_{W_{ij}}=\sigma_i\tanh\vartheta_j .
$$

$\tanh\vartheta_j$ is the conditional expectation of the hidden unit $h_j$ given the visible configuration, so the RBM log-derivatives are the connected correlators of the underlying Boltzmann model.

- **Expansion in visible correlations.** Expanding $\log2\cosh\vartheta_j$ in powers of $\vartheta_j$ shows that each hidden unit generates all even-order products of spins weighted by $W_{ij}$ (and odd orders through $b_j$). A Jastrow factor $\exp(\sum_{i<k}J_{ik}\sigma_i\sigma_k)$ is recovered exactly in the limit of small weights with $\alpha$ large; an RBM with $\alpha\ge1$ strictly contains it.

## Symmetric RBM

For a translation-invariant Hamiltonian the weights can be tied so that the ansatz is manifestly invariant. The hidden units are grouped into $\alpha$ *features* $f=1,\dots,\alpha$, each replicated over the $N$ lattice translations $T_t$:

$$
W_{i,(f,t)}=W^{(f)}_{T_t^{-1}i},\qquad b_{(f,t)}=b^{(f)},\qquad a_i=a ,
$$

so that

$$
\log\Psi(\boldsymbol{\sigma})=a\sum_i\sigma_i+\sum_{f=1}^{\alpha}\sum_{t=1}^{N}\log\Bigl[2\cosh\Bigl(b^{(f)}+\sum_iW^{(f)}_{T_t^{-1}i}\,\sigma_i\Bigr)\Bigr].
$$

Each feature is a convolution filter of the full lattice size, and the sum over translations is a global pooling, so the symmetric RBM is a one-layer convolutional network with $\log2\cosh$ nonlinearity and $\alpha$ channels. The number of parameters drops from $O(\alpha N^2)$ to $\alpha(N+1)+1$, the state is exactly in the zero-momentum sector, and the variance of the energy estimator is reduced because every sample contributes $N$ symmetry-related terms. The same construction extends to point-group and spin-flip symmetries by enlarging the group, and to a projection onto a chosen nontrivial irreducible representation by weighting the sum over group elements with characters.

## Complex parameters and sign structure

An RBM with real parameters is strictly positive, so it can only represent states that are positive in the chosen basis, i.e. stoquastic ground states after a suitable basis rotation. The Marshall sign rule makes the Heisenberg model on a bipartite lattice such a case: rotating the spins on one sublattice by $\pi$ about $z$ multiplies the ground-state amplitudes by $(-1)^{N_\uparrow^A}$ and leaves a positive state, which a real RBM can learn. For the transverse-field Ising model no rotation is needed.

Everything else needs a phase. Three constructions are in use:

1. **Complex parameters** $(a,b,W)\in\mathbb C$, the original choice. $\log\Psi$ is holomorphic, the gradient is $F_k=\langle\bar O_k^*\bar E_{\mathrm{loc}}\rangle$ and $S_{kk'}=\langle\bar O_k^*\bar O_{k'}\rangle$ without real parts (see [optimization](../optimization/)). Amplitude and phase share parameters, which couples their optimization.
2. **Two real networks**, $\log|\Psi|$ and $\arg\Psi$, each an RBM or a different architecture. Decouples the two problems and allows a phase network that outputs a discrete sign; the price is that the phase network is trained through $E_{\mathrm{loc}}$ only, which is a weak signal when the sign structure is wrong almost everywhere.
3. **A fixed sign prior times a positive RBM**, for example the Marshall sign for the J₁–J₂ model at small $J_2$, or a Gutzwiller-projected fermionic sign (Nomura et al., arXiv:1709.06475; Ferrari, Becca, Carrasquilla, arXiv:1906.00463). The network then only corrects the prior.

The sign structure, not the amplitudes, is what limits RBMs on frustrated magnets. Szabó and Castelnovo (arXiv:2002.04613) showed that an RBM supplied with the exact sign structure reaches high accuracy where the same RBM asked to learn the signs stalls; Westerhout et al. (arXiv:1907.08186) showed that the learned sign structure generalizes poorly to configurations not seen during training. The J₁–J₂ model near $J_2/J_1=0.5$ is the standard stress test, see the [benchmark page](../j1j2-square-lattice/).

## What an RBM can represent

- Any state with a polynomial number of nonzero amplitudes, and many with exponentially many: cluster states, graph states, and the toric code ground state have exact RBM representations with $\alpha$ of order one (Deng, Li, Das Sarma, arXiv:1701.04844).
- Volume-law entanglement with $O(N)$ hidden units when the weights are long-ranged; short-range RBMs (each hidden unit connected to a local patch) are area-law and are exactly equivalent to a class of string-bond and entangled-plaquette states (Chen et al., arXiv:1701.04831; Glasser et al., arXiv:1710.04045).
- Exact representations of a class of models obtained by a deterministic construction rather than optimization, including a deep-Boltzmann-machine form for imaginary-time evolution (Carleo, Nomura, Imada, arXiv:1802.09558).

Expressivity theorems say what is representable, not what is reachable by stochastic optimization from a random start. In practice the reachable accuracy on a given model is a function of $\alpha$, the symmetry construction, the sign treatment, and the optimizer, in roughly that order of importance.

## Original 2017 results

Carleo and Troyer optimized symmetric complex RBMs with stochastic reconfiguration on three models with periodic boundaries: the transverse-field Ising chain around its critical field, the antiferromagnetic Heisenberg chain, and the antiferromagnetic Heisenberg model on a $10\times10$ square lattice, for hidden-unit densities between $\alpha=1$ and $\alpha=32$. Accuracy was measured by the relative error $\epsilon_{\mathrm{rel}}=|E_{\mathrm{RBM}}-E_{\mathrm{ref}}|/|E_{\mathrm{ref}}|$ against exact or quantum Monte Carlo reference energies; for the $10\times10$ lattice the reference is the stochastic-series-expansion value $E/N=-0.671549(4)$ (Sandvik, arXiv:cond-mat/9707123).

The result that defined the field is the systematic decrease of $\epsilon_{\mathrm{rel}}$ with $\alpha$ on all three models, with no sign of the structural ceiling that limits mean-field and low-order Jastrow states, and, on the two-dimensional lattice, energies below the entangled-plaquette and PEPS results available for the same cluster at the time. The same paper used $S$ and $F$ in the time-dependent variational principle to follow the unitary dynamics after quenches of the transverse field and of the Heisenberg coupling. The error curves are in Figure 3 of the paper; Ketboard does not list these energies because they predate its instance definitions.

What was absent is as telling as what was present: no frustrated model appears, and the limitation of the RBM on frustrated lattices was identified in the following years as a problem of sign structure rather than of amplitude expressivity.

## Variants

- **RBM + pair product (RBM+pp)**: multiply the RBM by a Pfaffian or determinant of a pair-product state, giving a fermionic sign prior with a neural correlator (Nomura, Darmawan, Yamaji, Imada, arXiv:1709.06475). With quantum-number projection and a few Lanczos steps this remains among the most accurate ansätze for the square-lattice J₁–J₂ model (Nomura and Imada, arXiv:2005.14142).
- **Deep Boltzmann machines**: a second hidden layer makes the marginalization intractable in general but exact for specific constructions (arXiv:1802.09558); sampling the hidden layer jointly with the visible one restores tractability at the price of a larger state space.
- **Convolutional generalizations**: replacing the single $\log2\cosh$ layer by a stack of convolutional layers with a final pooling gives the convolutional and group-convolutional NQS (Choo, Neupert, Carleo, arXiv:1903.06713; Roth, Szabó, MacDonald, arXiv:2211.07749), with the hidden-unit density $\alpha$ reappearing as the channel count.

## References

- G. Carleo, M. Troyer, *Solving the quantum many-body problem with artificial neural networks*, arXiv:1606.02318 (2016). The complex symmetric RBM, its optimization, and the results discussed above.
- R. G. Melko, G. Carleo, J. Carrasquilla, J. I. Cirac, *Restricted Boltzmann machines in quantum physics*, Nature Physics 15, 887 (2019). Review of RBMs as quantum states.
- A. W. Sandvik, *Finite-size scaling of the ground-state parameters of the two-dimensional Heisenberg model*, arXiv:cond-mat/9707123 (1997). Reference energies for the square-lattice Heisenberg model.
- D.-L. Deng, X. Li, S. Das Sarma, *Quantum entanglement in neural network states*, arXiv:1701.04844 (2017). Entanglement of RBM states; exact representations of topological states.
- J. Chen, S. Cheng, H. Xie, L. Wang, T. Xiang, *Equivalence of restricted Boltzmann machines and tensor network states*, arXiv:1701.04831 (2017).
- I. Glasser, N. Pancotti, M. August, I. D. Rodriguez, J. I. Cirac, *Neural-network quantum states, string-bond states, and chiral topological states*, arXiv:1710.04045 (2017).
- G. Carleo, Y. Nomura, M. Imada, *Constructing exact representations of quantum many-body systems with deep neural networks*, arXiv:1802.09558 (2018).
- Y. Nomura, A. S. Darmawan, Y. Yamaji, M. Imada, *Restricted Boltzmann machine learning for solving strongly correlated quantum systems*, arXiv:1709.06475 (2017). RBM times pair-product states.
- Y. Nomura, M. Imada, *Dirac-type nodal spin liquid revealed by refined quantum many-body solver using neural-network wave function, correlation ratio, and level spectroscopy*, arXiv:2005.14142 (2020).
- F. Ferrari, F. Becca, J. Carrasquilla, *Neural Gutzwiller-projected variational wave functions*, arXiv:1906.00463 (2019).
- A. Szabó, C. Castelnovo, *Neural network wave functions and the sign problem*, arXiv:2002.04613 (2020).
- T. Westerhout, N. Astrakhantsev, K. S. Tikhonov, M. I. Katsnelson, A. A. Bagrov, *Generalization properties of neural network approximations to frustrated magnet ground states*, arXiv:1907.08186 (2019).
- K. Choo, T. Neupert, G. Carleo, *Two-dimensional frustrated J₁–J₂ model studied with neural network quantum states*, arXiv:1903.06713 (2019).
- C. Roth, A. Szabó, A. H. MacDonald, *High-accuracy variational Monte Carlo for frustrated magnets with deep neural networks*, arXiv:2211.07749 (2022).
